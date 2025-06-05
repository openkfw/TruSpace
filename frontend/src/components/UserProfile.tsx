"use client";

const UserProfile = ({ initials, name, email, collapsed }) => {
   return (
      <div className="flex items-center space-x-4">
         <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-lg font-semibold">{initials}</span>
         </div>
         {!collapsed && (
            <div className="flex-1">
               <div className="font-medium">{name}</div>
               <div className="text-sm text-gray-400">{email}</div>
            </div>
         )}
      </div>
   );
};

export default UserProfile;
