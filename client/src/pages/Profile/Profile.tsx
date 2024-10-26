import React, { useState, useEffect } from "react"
import { useAuth } from "../../hooks/useAuth"
import { getUserData, updateProfileImage } from "../../services/userService"
import { fetchMoviesByIds } from "@/services/movieService"
import { SimpleMovie } from "@/Types/Movie"
import { useNavigate } from "react-router-dom"
import { Drawer } from "@/components/ui/drawer"
import CreateList from "../CreateList/CreateList"
import AvatarSelectionModal from "./AvatarSelectionModal"
import {
    IconUser,
    IconList,
    IconChartBar,
    IconMovie,
} from "@tabler/icons-react"
import { Users, Award } from "lucide-react"
// import { BarChart1 } from "@/components/charts/BarChart"
import { AnimatePresence, motion } from "framer-motion"
import { calculateStats, MovieStats } from "@/lib/stats"
import { useJournal } from "@/services/journalService"
import DynamicBarChart from "@/components/charts/DynamicChart"
import { toast } from "react-toastify"

interface UserData {
    userName: string
    email: string
    age: number
    badges: string[]
    groups: string[]
    lists: List[]
    directors: string[]
    actors: string[]
    profile_image: string
    friends: string[]
}

interface List {
    list_id: string
    name: string
    list_type: "user" | "group"
    movies: MovieInList[]
    members: {
        user_id: string
        is_author: boolean
    }[]
    description: string
    date_created: Date
}

interface MovieInList {
    movie_id: string
    id: string
}

const Profile: React.FC = () => {
    const { user } = useAuth()
    const [userData, setUserData] = useState<UserData | null>(null)
    const [movieData, setMovieData] = useState<SimpleMovie[]>([])
    const navigate = useNavigate()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState<number>(0)
    const [stats, setStats] = useState<MovieStats | null>(null)
    const { useGetJournalEntries } = useJournal()
    const { data: journalEntries, isLoading, error } = useGetJournalEntries()
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.uid) return
            try {
                const data = await getUserData(user.uid)
                setUserData(data)

                const currentList = data.lists[activeIndex]
                if (currentList?.movies) {
                    const movieIds = currentList.movies.map(
                        (m: MovieInList) => m.movie_id
                    )
                    const movies = await fetchMoviesByIds(movieIds)
                    setMovieData(movies)
                }
            } catch (error) {
                console.error("Error fetching user data:", error)
                setUserData(null) // Handle error state
            }
        }

        fetchUserData()
    }, [user, activeIndex])

    useEffect(() => {
        if (!journalEntries) return
        const movieStats = calculateStats(journalEntries)
        setStats(movieStats)
    }, [journalEntries])

    if (isLoading || !userData || !stats) {
        return (
            <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
                <div className="border-4 border-white border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
            </div>
        )
    }

    if (error) return <div>Error loading stats. Please try again later.</div>

    const monthlyWatchedData = stats.monthlyWatched.map((item) => ({
        month: item.month,
        desktop: item.count,
    }))
    const handleSelectList = (listId: string) => {
        navigate(`/list/${listId}`)
    }

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false)
    }

    const ProfileInfo = () => (
        <div className="flex flex-row items-center justify-center gap-3 space-y-2">
            <div className="relative">
                <img
                    src={userData?.profile_image}
                    alt={userData?.userName}
                    className="w-24 h-24 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsAvatarModalOpen(true)}
                />
                <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" // Add cursor-pointer here
                    onClick={() => setIsAvatarModalOpen(true)}
                >
                    <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded cursor-pointer">
                        {"change"}
                    </span>
                </div>
            </div>
            <div className="text-center flex flex-col">
                <h2 className="text-3xl font-bold">{userData?.userName}</h2>
                <div className="flex flex-col items-center">
                    <div className="flex gap-1 items-center justify-center">
                        <Users
                            className="w-4 mr-2 text-blue-400 hover:text-blue-600 cursor-pointer" // Ensure cursor-pointer is applied here
                            onClick={() => navigate("/friends")}
                        />
                        <p>{userData?.friends.length}</p>
                    </div>
                    <div className="flex gap-1 items-center justify-center">
                        <Award className="w-4 h-4 mr-2 text-yellow-400" />
                        <p>{userData?.badges.length}</p>
                    </div>
                </div>
            </div>
        </div>
    )

    const MoviePreview = ({ movie }: { movie: SimpleMovie }) => (
        <div className="flex items-center space-x-2 ">
            <img
                src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                alt={movie.title}
                className="w-12 h-16 object-cover rounded"
                onClick={() => navigate(`/movie/${movie.id}`)}
            />
            <span className="text-sm font-medium">{movie.title}</span>
        </div>
    )

    const handleUpdateProfileImage = async (newProfileImage: string) => {
        const uid = user?.uid
        if (!uid) {
            toast.error("User ID is not available. Please log in again.")
            return
        }
        try {
            await updateProfileImage(uid, newProfileImage)
            // Update the userData with the new profile image
            setUserData((prevData) =>
                prevData
                    ? { ...prevData, profile_image: newProfileImage }
                    : null
            )
            toast.success("Profile image updated successfully")
        } catch (error) {
            console.error("Error updating profile image:", error)
            toast.error("Failed to update profile image. Please try again.")
        }
    }

    const BentoGridItem: React.FC<{
        title: string
        description: string
        icon: React.ReactNode
        children: React.ReactNode
        className?: string
    }> = ({ title, description, icon, children, className }) => (
        <div
            className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 flex flex-col ${className}`}
        >
            <div className="flex items-center space-x-2 mb-4">
                {icon}
                <h3 className="text-xl font-semibold">{title}</h3>
            </div>
            <p className="text-gray-400 mb-4">{description}</p>
            <div className="flex-grow">{children}</div>
        </div>
    )

    return (
        <>
            <div className="max-h-screen overflow-auto scrollbar-hide  px-12 lg:mt-0 lg:pt-2 pt-10 pb-6  text-white">
                {/* <h1 className="text-4xl font-bold mb-8 text-center">
                Your Profile
            </h1> */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full scrollbar-hide mx-auto">
                    <BentoGridItem
                        title="Profile Info"
                        description="Your profile details and stats"
                        icon={<IconUser className="h-6 w-6 text-blue-400" />}
                    >
                        <ProfileInfo />
                    </BentoGridItem>
                    <BentoGridItem
                        title="Your Lists"
                        description="View and manage your movie lists"
                        icon={<IconList className="h-6 w-6 text-green-400" />}
                    >
                        <button
                            onClick={() => navigate("/lists")}
                            className="mb-4 text-green-400 hover:text-green-600 transition-colors"
                        >
                            View All Lists
                        </button>
                        {/* <div className="space-y-3 max-h-20 overflow-auto scrollbar-hide">
                        {movieData.slice(0, 5).map((movie) => (
                            <MoviePreview key={movie.id} movie={movie} />
                        ))}
                    </div> */}
                        <div className="h-12 overflow-auto">
                            {userData?.lists.map(
                                (item: List, index: number) => (
                                    <button
                                        key={item.list_id}
                                        className={`p-2 w-full mb-2 rounded-md text-left transition-all duration-300 ${
                                            activeIndex === index
                                                ? "bg-gradient-to-tr from-gray-900 to-gray-800"
                                                : "bg-gray-700 hover:bg-gray-600"
                                        }`}
                                        onClick={() => setActiveIndex(index)}
                                    >
                                        {item.name}
                                    </button>
                                )
                            )}
                        </div>
                    </BentoGridItem>
                    <BentoGridItem
                        title="Your Stats"
                        description="View your movie watching statistics"
                        icon={
                            <IconChartBar className="h-6 w-6 text-yellow-400" />
                        }
                        className="md:row-span-2 flex flex-col justify-between flex-items-center"
                    >
                        <button
                            onClick={() => navigate(`/stats`)}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                            View Stats
                        </button>
                        <div className="h-full lg:mt-12 ">
                            <DynamicBarChart data={monthlyWatchedData} />
                        </div>
                    </BentoGridItem>

                    <BentoGridItem
                        title={`${userData?.lists[activeIndex]?.name || "Selected List"} Preview`}
                        description={`Movies in ${userData?.lists[activeIndex]?.name || "selected list"}`}
                        icon={<IconMovie className="h-6 w-6 text-purple-400" />}
                        className="md:col-span-2"
                    >
                        <AnimatePresence>
                            <motion.div
                                key={activeIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="space-y-3 max-h-28 overflow-auto scrollbar-hide">
                                    {movieData.map((movie) => (
                                        <MoviePreview
                                            key={movie.id}
                                            movie={movie}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={() =>
                                        handleSelectList(
                                            userData?.lists[activeIndex]
                                                .list_id!
                                        )
                                    }
                                    className="mt-4 text-purple-400 hover:text-purple-700 transition-colors"
                                >
                                    View Full List
                                </button>
                            </motion.div>
                        </AnimatePresence>
                    </BentoGridItem>
                    <BentoGridItem
                        title="AI Recommendations"
                        description="Personalized movie recommendations"
                        icon={<IconMovie className="h-6 w-6 text-purple-400" />}
                        className="md:col-span-3"
                    >
                        <button
                            onClick={() => navigate("/recommendations")}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            coming soon
                        </button>
                    </BentoGridItem>
                </div>
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <CreateList onClose={handleCloseDrawer} />
                </Drawer>
            </div>
            <AvatarSelectionModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                onSelectAvatar={handleUpdateProfileImage} // Pass the function here
                currentAvatar={userData?.profile_image || ""}
            />
        </>
    )
}

export default Profile
