import React from "react";
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import { AuthProvider, useAuth } from '../context/AuthContext/AuthContext';
import RegistrationSuccess from "../components/modals/registrationSuccess/RegistrationSuccess";
import BookingDetails from "../components/molecules/bookingDetails/BookingDetails";
import EditBooking from "../components/molecules/bookingDetails/EditBooking";
import BookingList from "../components/molecules/bookingList/BookingList";
import GuestCheckout from "../components/organisms/CheckOutGuest/MultiCheckOut";
import AuthPage from "../components/pages/AuthPage/AuthPage";
import FirstCardPage from "../components/pages/FirstCardPage/FirstCardPage";
import HomePage from "../components/pages/HomePage/HomePage";
import MainPage from "../components/pages/MainPage/MainPage";
import ProfilePage from "../components/pages/ProfilePage/ProfilePage";
import SecondPage from "../components/pages/SecondPage/SecondPage";
import ThirdPage from "../components/pages/ThirdPage/ThirdPage";
import MultiCheckOut from "../components/organisms/CheckOutGuest/MultiCheckOut";


const PrivateRoute = ({ children }: { children: JSX.Element }) => {
	const { isAuthenticated } = useAuth();
	return isAuthenticated ? children : <Navigate to="/auth" />;
};

const MainRouter = () => {
	return (
		<AuthProvider>
		<BrowserRouter>
			<Routes>
				<Route path='/' element={<HomePage />} />
				<Route path='/auth' element={<AuthPage />}/>
				<Route path='/main' element={<MainPage />}/>
				<Route path='/firstcard' element={<FirstCardPage />}/>
				<Route path='/secondcard' element={<SecondPage/>}/>
				<Route path='/thirdcard' element={<ThirdPage/>}/>
				<Route path='/profile' element={<ProfilePage />}/>
				<Route path="/registration-success" element={<RegistrationSuccess />} />
				<Route path="/bookings" element={<BookingList />} />
				<Route path="/bookings/:id" element={<BookingDetails />} />
				<Route path="/bookings/:id/edit" element={<EditBooking />} />
				<Route path="/bookings/:bookingId/checkout" element={<GuestCheckout />} />
				<Route path="/mass-checkout" element={<MultiCheckOut />} />
			</Routes>
		</BrowserRouter>
		</AuthProvider>
	);
};

export default MainRouter;
