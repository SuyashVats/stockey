"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const node_fetch_1 = __importDefault(require("node-fetch"));
exports.default = {
    fetch: node_fetch_1.default,
    URLSearchParams: url_1.URLSearchParams,
};
