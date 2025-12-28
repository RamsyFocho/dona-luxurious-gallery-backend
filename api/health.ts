export default function handler(_req: any, res: any) {
  // Lightweight endpoint useful to verify that Vercel serverless functions are working
  res.status(200).json({ status: "ok" });
}
