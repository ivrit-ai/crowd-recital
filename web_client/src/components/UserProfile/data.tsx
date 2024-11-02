import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getUserProfileOptions } from "@/client/queries/users";
import { updateUserProfile } from "@/client/user";

export const useUserProfileData = () => {
  const queryClient = useQueryClient();
  const { data, isPending, refetch } = useQuery(getUserProfileOptions());
  const mutation = useMutation({
    mutationFn: updateUserProfile,
    onSettled: async () => {
      return await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });

  return { data, isPending, refetch, mutation };
};
