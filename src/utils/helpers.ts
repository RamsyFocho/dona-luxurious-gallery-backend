import { Request } from 'express';

export const parseJsonArray = (jsonString: string): any[] => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return [];
  }
};

export const stringifyJsonArray = (array: any[]): string => {
  return JSON.stringify(array);
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

export const getPaginationParams = (req: Request) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};