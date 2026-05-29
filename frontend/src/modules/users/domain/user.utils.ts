export const getUserInitials = (name: string) => {
   return name
      .split(" ")
      .map((value) => value[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
};
