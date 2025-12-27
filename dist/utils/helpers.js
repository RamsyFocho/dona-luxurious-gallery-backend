"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = exports.generateSlug = exports.stringifyJsonArray = exports.parseJsonArray = void 0;
const parseJsonArray = (jsonString) => {
    try {
        return JSON.parse(jsonString);
    }
    catch (error) {
        return [];
    }
};
exports.parseJsonArray = parseJsonArray;
const stringifyJsonArray = (array) => {
    return JSON.stringify(array);
};
exports.stringifyJsonArray = stringifyJsonArray;
const generateSlug = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
};
exports.generateSlug = generateSlug;
const getPaginationParams = (req) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.getPaginationParams = getPaginationParams;
//# sourceMappingURL=helpers.js.map