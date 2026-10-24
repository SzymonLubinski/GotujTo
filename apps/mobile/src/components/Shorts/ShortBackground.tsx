import {View} from "react-native";
import Svg, {Defs, LinearGradient, RadialGradient, Rect, Stop} from "react-native-svg";

/** Keeps contained media readable without cropping it into the background. */
export default function ShortBackground() {
    return (
        <View pointerEvents="none" className="absolute inset-0 overflow-hidden bg-[#020202]">
            <Svg width="100%" height="100%" style={{position: "absolute"}}>
                <Defs>
                    <LinearGradient id="shortVideoBase" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#18181b" />
                        <Stop offset="0.52" stopColor="#09090b" />
                        <Stop offset="1" stopColor="#020202" />
                    </LinearGradient>
                    <RadialGradient id="shortVideoGlow" cx="50%" cy="18%" rx="50%" ry="42%">
                        <Stop offset="0" stopColor="#84cc16" stopOpacity={0.18} />
                        <Stop offset="1" stopColor="#84cc16" stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#shortVideoBase)" />
                <Rect width="100%" height="100%" fill="url(#shortVideoGlow)" />
            </Svg>
        </View>
    );
}
