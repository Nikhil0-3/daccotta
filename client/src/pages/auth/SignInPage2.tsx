import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { auth } from "../../lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { Link } from "react-router-dom"
import { CheckCircle, Eye, EyeOff, XCircle } from "lucide-react"
import { checkEmailExists } from "@/services/userService"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth";

export const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export type SignInFormData = z.infer<typeof signInSchema>

const SignInPage2: React.FC = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
    } = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
    })

    const [isEmailExists, setIsEmailExists] = useState<boolean | null>(null)
    const [isCheckingEmail, setIsCheckingEmail] = useState(false)

    const [hidden, setHidden] = useState(true)

    const email = watch("email")

    useEffect(() => {
        const checkEmailExistence = async () => {
            const emailPattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;

            if (email && emailPattern.test(email)) {
                setIsCheckingEmail(true)
                try {
                    const exists = await checkEmailExists(email)
                    setIsEmailExists(exists)
                } catch (error) {
                    console.error("Error checking email existence:", error)
                    setIsEmailExists(null)
                } finally {
                    setIsCheckingEmail(false)
                }
            } else {
                setIsEmailExists(null)
            }
        }
        const debounce = setTimeout(checkEmailExistence, 500)
        return () => clearTimeout(debounce)
    }, [email])

    const signInMutation = useMutation({
        mutationFn: (data: SignInFormData) =>
            signInWithEmailAndPassword(auth, data.email, data.password),
        onSuccess: () => {
            toast.success("Successfully signed in!")
            reset()
        },
        onError: (error) => {
            console.error("Failed to sign in:", error)
            toast.error("Incorrect email or password. Please try again.")
            reset()
        },
    })

    const onSubmit = (data: SignInFormData) => {
        signInMutation.mutate(data)
    }

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if the user already exists in your backend
            const email = user.email;
            if (email) {
                const emailExists = await checkEmailExists(email); // Ensure this function is defined

                if (emailExists) {
                    toast.success("Successfully signed in with Google!");
                } else {
                    toast.info("User does not exist. Redirecting to sign-up...");
                    window.location.href = "/signup"; // Redirect to sign-up page
                }
            }
        } catch (error) {
            console.error("Failed to sign in with Google:", error);
            toast.error("Failed to sign in with Google. Please try again.");
        }
    }

    const resetPassword = async () => {
        if (!email) {
            toast.error("Please enter your email address.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success("Password reset email sent! Check your inbox.");
        } catch (error) {
            console.error("Failed to send password reset email:", error);
            toast.error("Failed to send password reset email. Please try again.");
        }
    };

    return (
        <>
            <div className="w-full min-h-screen lg:grid lg:grid-cols-5 font-heading">
                <div className="lg:col-span-2 h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-black text-white">
                    <div className="max-w-md w-full space-y-8">
                        <div>
                            <h2 className="mt-6 text-center text-3xl font-extrabold">
                                Sign In
                            </h2>
                        </div>
                        <form
                            className="mt-8 space-y-6"
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <div className="space-y-4 text-white">
                                <div>
                                    <Label htmlFor="email" className="sr-only">
                                        Email
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Email"
                                            className={`bg-gray-800 text-white ${errors.email ? "border-red-500" : ""}`}
                                            {...register("email")}
                                        />
                                        {email && (
                                                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                    {isCheckingEmail ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                                    ) : isEmailExists ===
                                                      true ? (
                                                        <CheckCircle
                                                            className="text-green-500"
                                                            size={16}
                                                        />
                                                    ) : isEmailExists ===
                                                      false ? (
                                                        <XCircle
                                                            className="text-red-500"
                                                            size={16}
                                                        />
                                                    ) : null}
                                                </span>
                                            )}
                                    </div>
                                    {errors.email && (
                                        <p className="mt-2 text-sm text-red-500">
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label
                                        htmlFor="password"
                                        className="sr-only"
                                    >
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={hidden ? "password" : "text"}
                                            placeholder="Password"
                                            className="bg-gray-800 text-white"
                                            {...register("password")}
                                        />
                                        <div
                                            className="absolute top-0 p-2 right-2 h-full aspect-square flex justify-center items-center z-20 hover:cursor-pointer"
                                            onClick={() => setHidden(!hidden)}
                                        >
                                            {hidden ? <EyeOff /> : <Eye />}
                                        </div>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-2 text-sm text-red-500">
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600"
                                    disabled={
                                        signInMutation.isPending ||
                                        !isEmailExists
                                    }
                                >
                                    {signInMutation.isPending
                                        ? "Signing In..."
                                        : "Sign In"}
                                </Button>
                            </div>
                        </form>
                        {/* Reset Password Button */}
                        <div className="mt-4">
                            <Button
                                onClick={resetPassword}
                                className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-400 hover:to-red-600"
                                disabled={!isEmailExists}
                            >
                                Forgot Password?
                            </Button>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-black text-gray-400">
                                    OR
                                </span>
                            </div>
                        </div>

                        {/* Sign in with Google Button */}
                        { <div className="mt-4">
                            <Button
                                onClick={signInWithGoogle}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600"
                            >
                                <img
                                    src="/google.svg" // Adjust the path as needed
                                    alt="Google Logo"
                                    className="h-5 w-5 mr-2" // Adjust size as needed
                                />
                                <span>Continue with Google</span>
                            </Button>
                        </div> }

                        <p className="mt-2 text-center text-sm text-gray-300">
                            New User?{" "}
                            <Link
                                to="/signup"
                                className="font-medium text-blue-400 hover:text-blue-300"
                            >
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="hidden lg:flex lg:col-span-3 bg-[#FF204E] items-center justify-center">
                    <img
                        src="/movie_signup.svg"
                        alt="Sign In Illustration"
                        className="w-[400px] h-auto"
                    />
                </div>
            </div>
            <ToastContainer />
        </>
    )
}

export default SignInPage2
