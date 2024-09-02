import { User } from "@/types/user";

const adminApiBasePath = "/api/admin";

type UsersReponse = {
  data: User[];
  total_count: number;
};

class AdminClient {
  private accessToken: string;
  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async request(
    path: string,
    method: string,
    query: URLSearchParams | null = null,
    body: object | null = null,
  ) {
    const searchQuery = query ? `?${query.toString()}` : "";
    const response = await fetch(`${adminApiBasePath}${path}${searchQuery}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: body && JSON.stringify(body),
    });
    return await response.json();
  }

  async getAllUsers(
    page: number = 0,
    itemsPerPage: number = 20,
  ): Promise<UsersReponse> {
    return this.request(
      "/users",
      "GET",
      new URLSearchParams({
        page: page.toString(),
        itemsPerPage: itemsPerPage.toString(),
      }),
    );
  }
}

export default AdminClient;
