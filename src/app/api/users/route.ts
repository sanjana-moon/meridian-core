import {
  createUser,
  listUsers,
  updateCustomerStatus,
} from "@/server/controllers/user.controller";

export async function GET(request: Request) {
  void request.url;
  return listUsers(request);
}

export const POST = createUser;
export const PATCH = updateCustomerStatus;
