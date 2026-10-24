import {View} from "react-native";
import Svg, {Defs, LinearGradient, Rect, Stop} from "react-native-svg";

export default function ShortTitleBackground() {
    return (
        <View pointerEvents="none" style={{position: "absolute", bottom: 0, left: 0, right: 0, height: "45%"}}>
            <Svg width="100%" height="100%">
                <Defs>
                    <LinearGradient id="shortTitleFade" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#000" stopOpacity={0} />
                        <Stop offset="1" stopColor="#000" stopOpacity={0.65} />
                    </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#shortTitleFade)" />
            </Svg>
        </View>
    );
}
