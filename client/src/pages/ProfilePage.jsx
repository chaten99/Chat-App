import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);

  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let profileData = { fullName: name, bio };

      if (selectedImg) {
        const base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(selectedImg);
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });

        profileData.profilePic = base64Image;
      }

      await updateProfile(profileData);
      navigate("/");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b141a] px-4">
      <div className="w-full max-w-2xl bg-[#111b21] rounded-xl shadow-xl flex items-center justify-between max-sm:flex-col p-8 gap-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
          <h3 className="text-xl font-semibold text-white">Profile Details</h3>

          <label
            htmlFor="avatar"
            className="flex items-center gap-3 cursor-pointer text-gray-300"
          >
            <input
              onChange={(e) => setSelectedImg(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <img
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : authUser?.profilePic || assets.avatar_icon
              }
              alt=""
              className="w-14 h-14 rounded-full object-cover"
            />
            Change profile photo
          </label>

          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            required
            placeholder="Your name"
            className="px-4 py-2 bg-[#202c33] rounded-md text-white outline-none focus:ring-2 focus:ring-[#00a884]"
          />

          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            required
            rows={4}
            placeholder="Write profile bio..."
            className="px-4 py-2 bg-[#202c33] rounded-md text-white outline-none focus:ring-2 focus:ring-[#00a884]"
          />

          <button
            type="submit"
            disabled={loading}
            className={`py-2 rounded-md font-medium flex items-center justify-center gap-2
  ${
    loading
      ? "bg-gray-500 cursor-not-allowed"
      : "bg-[#00a884] hover:bg-[#019f7a]"
  } 
`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>

        <img
          src={
            selectedImg
              ? URL.createObjectURL(selectedImg)
              : authUser?.profilePic || assets.logo_icon
          }
          alt=""
          className="w-40 h-40 rounded-full object-cover"
        />
      </div>
    </div>
  );
};

export default ProfilePage;
