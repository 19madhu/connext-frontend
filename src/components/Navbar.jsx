import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { setSelectedUser } = useChatStore();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await axiosInstance.get(`/users/search?q=${searchQuery}`);
        setSearchResults(res.data);
      } catch (err) {
        setSearchResults([]);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Left Logo + Search */}
          <div className="flex items-center gap-4 relative">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Connext</h1>
            </Link>

            {/* ✅ Show search only if logged in */}
            {authUser && (
              <>
                <button
                  className="btn btn-ghost btn-sm px-2"
                  onClick={() => {
                    setShowSearch((prev) => !prev);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                </button>

                {showSearch && (
                  <div className="relative z-50 overflow-visible">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for users"
                      className="input input-bordered input-sm w-64 transition-all duration-200"
                    />
                    {searchResults.length > 0 && (
                      <ul className="absolute top-12 left-0 w-64 bg-base-100 border border-base-300 rounded shadow z-50">
                        {searchResults.map((user) => (
                          <li
                            key={user._id}
                            className="p-2 hover:bg-base-200 cursor-pointer flex gap-2 items-center"
                            onClick={() => handleSelectUser(user)}
                          >
                            <img
                              src={user.profilePic || "/avatar.png"}
                              alt={user.fullName}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="truncate">{user.fullName}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-2">
            <Link to="/settings" className="btn btn-sm gap-2 transition-colors">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            {authUser && (
              <>
                <Link to="/profile" className="btn btn-sm gap-2">
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;