import { Redirect } from 'expo-router';
import { useAppSelector } from '../Redux/hooks';

export default function Index() {
    const token = useAppSelector((state) => state.auth.token);
    console.log(token);
    

    if (token) {
        return <Redirect href="/user" />;
    }

    return <Redirect href="/splash" />;
}
