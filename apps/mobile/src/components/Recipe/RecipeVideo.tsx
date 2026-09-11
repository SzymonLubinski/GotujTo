import {useEvent, useEventListener} from "expo";
import {useVideoPlayer, VideoView} from "expo-video";
import {Pause, Play, Volume2, VolumeX} from "lucide-react-native";
import {useState} from "react";
import {Pressable, View} from "react-native";
import VideoLoadingPlaceholder from "@/components/Shorts/VideoLoadingPlaceholder";


type RecipeVideoProps = {
    uri: string;
};

export default function RecipeVideo({uri}: RecipeVideoProps) {
    const [isMuted, setIsMuted] = useState(true);
    const player = useVideoPlayer(uri, player => {
        player.loop = true;
        player.muted = true;
    });

    const {isPlaying} = useEvent(
        player,
        "playingChange",
        {
            isPlaying: player.playing,
        },
    );

    const {status} = useEvent(
        player,
        "statusChange",
        {
            status: player.status,
        },
    );

    const isLoading =
        status === "idle" ||
        status === "loading";

    useEventListener(
        player,
        "statusChange",
        ({status, error}) => {
            if (error) {
                console.error("Recipe video error:", error.message);
                return;
            }

            if (status === "readyToPlay") {
                player.play();
            }
        },
    );

    const togglePlayback = () => {
        if (isPlaying) {
            player.pause();
            return;
        }

        player.play();
    };

    const toggleMuted = () => {
        const nextMuted = !isMuted;

        player.muted = nextMuted;
        setIsMuted(nextMuted);
    };

    return (
        <View className="h-full w-full bg-black">
            <VideoView
                player={player}
                style={{
                    position: "absolute",
                    inset: 0,
                }}
                contentFit="contain"
                nativeControls={false}
                fullscreenOptions={{
                    enable: true,
                }}
            />

            {isLoading && (
                <View
                    className="absolute inset-0 z-10"
                    pointerEvents="none"
                >
                    <VideoLoadingPlaceholder showIndicator />
                </View>
            )}

            {!isLoading && (
                <View className="absolute bottom-12 right-4 z-30 flex-row gap-3">
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                            isPlaying
                                ? "Zatrzymaj film"
                                : "Odtwórz film"
                        }
                        onPress={togglePlayback}
                        className="h-11 w-11 items-center justify-center rounded-full bg-black/65"
                    >
                        {isPlaying ? (
                            <Pause
                                size={21}
                                color="#ffffff"
                                fill="#ffffff"
                            />
                        ) : (
                            <Play
                                size={21}
                                color="#ffffff"
                                fill="#ffffff"
                            />
                        )}
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                            isMuted
                                ? "Włącz dźwięk"
                                : "Wycisz film"
                        }
                        onPress={toggleMuted}
                        className="h-11 w-11 items-center justify-center rounded-full bg-black/65"
                    >
                        {isMuted ? (
                            <VolumeX
                                size={21}
                                color="#ffffff"
                            />
                        ) : (
                            <Volume2
                                size={21}
                                color="#ffffff"
                            />
                        )}
                    </Pressable>
                </View>
            )}
        </View>
    );
}