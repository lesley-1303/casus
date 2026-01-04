import jwt from "jsonwebtoken";

export function getUserIdFromRequest(req) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split(" ")[1];

  const payload = jwt.verify(
    token,
    process.env.JWT_SECRET
  );

  const userId = payload.id;

  if (!userId) {
    throw new Error("Invalid token payload");
  }

  return userId;
}
