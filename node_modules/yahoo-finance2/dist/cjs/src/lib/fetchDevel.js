"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* istanbul ignore file */
const node_fetch_1 = __importStar(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
//const FILE_BASE = path.join(__dirname, "..", "..", "tests", "http");
const BASE_URL = new URL("../../tests/http/", import.meta.url);
class FakeResponse {
    constructor(props) {
        Object.keys(props).forEach((key) => (this[key] = props[key]));
        const rawHeaders = this.headers;
        this.headers = new node_fetch_1.Headers(rawHeaders);
        // node-fetch extension, needed to handle multiple set-cookie headers
        this.headers.raw = () => rawHeaders;
    }
    json() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bodyJson || JSON.parse(this.body);
        });
    }
    text() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.body;
        });
    }
}
function urlHash(url) {
    var hash = crypto_1.default.createHash("sha1");
    hash.update(url);
    return hash.digest("hex");
}
const cache = {};
function fetchDevel(url, fetchOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.FETCH_DEVEL === "nocache")
            return yield (0, node_fetch_1.default)(url, fetchOptions);
        // Use query2 for all our tests / fixtures / cache
        url = url.replace(/^https:\/\/query1.finance.yahoo.com/, "https://query2.finance.yahoo.com");
        // Remove crumb param to have consistent cacheable URLs
        const origUrl = url;
        url = url.replace(/[?&]crumb=[^?&]+/, "");
        // If devel===true, hash the url, otherwise use the value of devel
        // This allows us to specify our own static filename vs url hash.
        /*
        const filename = path.join(
          FILE_BASE,
          fetchOptions.devel === true ? urlHash(url) : fetchOptions.devel
        );
        */
        const destUrl = new URL("./" + (fetchOptions.devel === true ? urlHash(url) : fetchOptions.devel), BASE_URL);
        const filename = destUrl.toString();
        if (cache[filename])
            return cache[filename];
        let contentJson, contentObj;
        try {
            contentJson = yield fs_1.default.promises.readFile(destUrl, { encoding: "utf8" });
            contentObj = JSON.parse(contentJson);
        }
        catch (error) {
            if (error.code === "ENOENT") {
                const res = yield (0, node_fetch_1.default)(origUrl, fetchOptions);
                contentObj = {
                    request: {
                        url: url,
                    },
                    response: {
                        ok: res.ok,
                        status: res.status,
                        statusText: res.statusText,
                        headers: res.headers.raw(),
                        // body: await res.text(),
                    },
                };
                const contentTypeHeader = contentObj.response.headers["content-type"];
                const contentType = contentTypeHeader && contentTypeHeader[0].split(";");
                if (contentType === "application/json") {
                    contentObj.response.bodyJson = yield res.json();
                }
                else {
                    contentObj.response.body = yield res.text();
                }
                contentJson = JSON.stringify(contentObj, null, 2);
                yield fs_1.default.promises.writeFile(destUrl, contentJson, { encoding: "utf8" });
            }
            else {
                throw error;
            }
        }
        if (contentObj.request.url !== url && !filename.match(/\.fake\.json$/)) {
            const message = "URL mismatch - did you want to delete stale cached " +
                "result or rename to .fake.json?\n\n" +
                "  Requested URL: " +
                url +
                "\n" +
                "  Cached URL:    " +
                contentObj.request.url +
                "\n" +
                "\n" +
                "File: " +
                filename;
            throw new Error(message);
        }
        const res = (cache[filename] = new FakeResponse(contentObj.response));
        return res;
    });
}
exports.default = fetchDevel;
