const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const killPort = require("kill-port");
const axios = require("axios");

require("dotenv").config();

const app = express();
const PORT = parseInt(process.env.PORT, 10);
const ETH_RPC_URL = process.env.ETH_RPC_URL;
const DEFAULT_CONTRACT_ADDRESS = process.env.DEFAULT_CONTRACT_ADDRESS;
const DEFAULT_NETWORK_NAME = process.env.NETWORK_NAME;
const ERC20_METHODS = {
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",
};

const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

const contractCall = async (to, data) => {
  const response = await axios.post(ETH_RPC_URL, {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "eth_call",
    params: [{ to, data }, "latest"],
  });

  if (response.data.error) {
    throw new Error(response.data.error.message);
  }

  return response.data.result;
};

const decodeAbiString = (hexValue) => {
  const cleanHex = hexValue.replace(/^0x/, "");
  const length = Number.parseInt(cleanHex.slice(64, 128), 16);
  const stringHex = cleanHex.slice(128, 128 + length * 2);

  return Buffer.from(stringHex, "hex").toString("utf8");
};

const decodeAbiUint = (hexValue) => BigInt(hexValue);

const formatUnits = (value, decimals) => {
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  const fractionText = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");

  return fractionText ? `${whole}.${fractionText}` : whole.toString();
};

const readErc20Contract = async (contractAddress) => {
  const [nameHex, symbolHex, decimalsHex, totalSupplyHex] = await Promise.all([
    contractCall(contractAddress, ERC20_METHODS.name),
    contractCall(contractAddress, ERC20_METHODS.symbol),
    contractCall(contractAddress, ERC20_METHODS.decimals),
    contractCall(contractAddress, ERC20_METHODS.totalSupply),
  ]);

  const decimals = Number(decodeAbiUint(decimalsHex));
  const totalSupply = decodeAbiUint(totalSupplyHex);

  return {
    contractName: decodeAbiString(nameHex),
    tokenSymbol: decodeAbiString(symbolHex),
    decimals,
    totalSupply: formatUnits(totalSupply, decimals),
    contractAddress,
    network: DEFAULT_NETWORK_NAME,
  };
};

const checkPort = async (port, maxPort = 65535) => {
  if (port > maxPort) {
    throw new Error("No available ports found");
  }

  try {
    await killPort(port, "tcp");
    await killPort(port, "udp");
    return port;
  } catch (err) {
    return checkPort(port + 1, maxPort);
  }
};

(async () => {
  const safePort = await checkPort(PORT);
  const getPort = (await import("get-port")).default; // dynamic import
  const final_port = await getPort({ port: safePort });

  console.log(`Port ${final_port} is free. Ready to start server.`);

  // Middleware
  app.use(cors({ origin: `http://localhost:${final_port}` }));
  app.use(express.json());
  app.use(morgan("dev"));

  // Routes
  app.use("/api/items", require("./routes/items"));
  app.use("/api/stats", require("./routes/stats"));

  /**
   * @route    GET /api/nsdApiTest
   * @desc     Reads public data from an ERC-20 smart contract.
   * @author   Raj
   * @access   public
   * @query    {string} contractAddress - Optional ERC-20 contract address. Defaults to USDC.
   * @returns  {JSON} Token name, symbol, decimals, total supply, contract address, and network.
   * @throws   500 when the public RPC call or contract read fails.
   */
  app.get("/api/nsdApiTest", async (req, res) => {
    try {
      const contractAddress =
        req.query.contractAddress || DEFAULT_CONTRACT_ADDRESS;

      if (!isValidAddress(contractAddress)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contractAddress query parameter",
        });
      }

      const result = await readErc20Contract(contractAddress);

      console.log("nsdApiTest smart contract result:", result);
      res.json({ success: true, data: result });
    } catch (err) {
      console.error("nsdApiTest failed:", err.message);
      res.status(500).json({
        success: false,
        message: "Failed to fetch smart contract data",
        error: err.message,
      });
    }
  });

  require("./config/dbHandler.js").connect();

  /**
   * @route    [HTTP_METHOD] /api/endpoint
   * @desc     [Short summary of what this endpoint does, e.g., Reads or sets value in smart contract]
   * @author   [Your Name]
   * @access   [public/private/auth-required]
   * @param    {Request}  req  - Express request object. [Describe relevant body/query/params fields]
   * @param    {Response} res  - Express response object.
   * @returns  {JSON}          [Describe the JSON structure returned]
   * @throws   [Error conditions, e.g., 400 on invalid input, 500 on contract failure]
   *
   * @example
   * // Example request
   * curl -X POST http://localhost:3001/contract/value -H "Content-Type: application/json" -d '{"value": 42}'
   *
   * // Example response
   * {
   *   "message": "Value updated",
   *   "txHash": "0x..."
   * }
   */

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    app.use(express.static("client/build"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
    });
  }

  // Start server
  app.listen(final_port, () => {
    console.log(`Backend running on http://localhost:${final_port}`);
  });
})();
