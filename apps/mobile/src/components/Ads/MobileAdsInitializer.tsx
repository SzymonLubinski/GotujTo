import {useEffect} from "react";
import mobileAds from "react-native-google-mobile-ads";

export default function MobileAdsInitializer() {
    useEffect(() => {
        mobileAds()
            .initialize()
            .then(() => {
                console.log("Google Mobile Ads initialized");
            })
            .catch(error => {
                console.error("Google Mobile Ads initialization failed:", error);
            });
    }, []);

    return null;
}