import {useEvent, useEventListener} from "expo";
import {useVideoPlayer, VideoView} from "expo-video";
import {Pause, Play, Volume2, VolumeX} from "lucide-react-native";
import {useEffect} from "react";
import {Pressable, View} from "react-native";
import VideoLoadingPlaceholder from "./VideoLoadingPlaceholder";

type ShortsVideoProps = {
    uri: string;
    isMuted: boolean;
    onMutedChange: (muted: boolean) => void;
};

export default function ShortsVideo({uri, isMuted, onMutedChange}: ShortsVideoProps) {
    const player = useVideoPlayer(uri, player => {
        player.loop = true;
        player.muted = isMuted;
    });

    const {isPlaying} = useEvent(player, "playingChange", {
        isPlaying: player.playing,
    });

    const {status} = useEvent(player, "statusChange", {
        status: player.status,
    });

    const isLoading =
        status === "idle" ||
        status === "loading";

    useEffect(() => {
        player.muted = isMuted;
    }, [isMuted, player]);

    useEventListener(player, "statusChange", ({status, error}) => {
        if (error) {
            console.error("Shorts video error:", error.message);
            return;
        }

        if (status === "readyToPlay") {
            player.play();
        }
    });

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
        onMutedChange(nextMuted);
    };

    return (
        <View className="flex-1 bg-neutral-950">
            <VideoView
                player={player}
                pointerEvents="none"
                style={{
                    position: "absolute",
                    inset: 0,
                }}
                contentFit="cover"
                nativeControls={false}
            />

            {isLoading && (
                <View
                    pointerEvents="none"
                    className="absolute inset-0"
                    style={{zIndex: 10}}
                >
                    <VideoLoadingPlaceholder showIndicator />
                </View>
            )}

            {!isLoading && (
                <View
                    pointerEvents="box-none"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 20,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                            isPlaying
                                ? "Zatrzymaj film"
                                : "Odtwórz film"
                        }
                        onPress={togglePlayback}
                        className="h-14 w-14 items-center justify-center rounded-full bg-black/50"
                    >
                        {isPlaying ? (
                            <Pause
                                size={28}
                                color="#ffffff"
                                fill="#ffffff"
                            />
                        ) : (
                            <Play
                                size={28}
                                color="#ffffff"
                                fill="#ffffff"
                            />
                        )}
                    </Pressable>
                </View>
            )}

            {!isLoading && (
                <View
                    pointerEvents="box-none"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 30,
                    }}
                >
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                            isMuted
                                ? "Włącz dźwięk"
                                : "Wycisz film"
                        }
                        onPress={toggleMuted}
                        className="absolute right-4 top-30 h-11 w-11 items-center justify-center rounded-full bg-black/50"
                    >
                        {isMuted ? (
                            <VolumeX
                                size={22}
                                color="#ffffff"
                            />
                        ) : (
                            <Volume2
                                size={22}
                                color="#ffffff"
                            />
                        )}
                    </Pressable>
                </View>
            )}
        </View>
    );
}