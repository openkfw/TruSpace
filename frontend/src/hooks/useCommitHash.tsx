import { useEffect, useState } from "react";

export function useCommitHash() {
   const [hash, setHash] = useState(
      process.env.NODE_ENV === "production"
         ? process.env.NEXT_PUBLIC_SHORT_COMMIT_HASH
         : ""
   );

   useEffect(() => {
      if (process.env.NODE_ENV === "development") {
         fetch("/api/commit-hash")
            .then((res) => res.text())
            .then((data) => setHash(data))
            .catch(() => setHash("unknown"));
      }
   }, []);

   return hash;
}
