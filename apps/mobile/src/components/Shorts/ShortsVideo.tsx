import {useEvent, useEventListener} from "expo";
import {useVideoPlayer, VideoView} from "expo-video";
import {Play, Volume2, VolumeX} from "lucide-react-native";
import {useEffect, useRef} from "react";
import {Pressable, View} from "react-native";
import VideoLoadingPlaceholder from "./VideoLoadingPlaceholder";

type ShortsVideoProps = {
    uri: string;
    isMuted: boolean;
    onMutedChange: (muted: boolean) => void;
};

export default function ShortsVideo({uri, isMuted, onMutedChange}: ShortsVideoProps) {
    const pausedByUser = useRef(false);
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
        // expo-video exposes mutable playback state through the player instance.
        // eslint-disable-next-line react-hooks/immutability
        player.muted = isMuted;
    }, [isMuted, player]);

    useEventListener(player, "statusChange", ({status, error}) => {
        if (error) {
            console.error("Shorts video error:", error.message);
            return;
        }

        if (status === "readyToPlay" && !pausedByUser.current) {
            player.play();
        }
    });

    const togglePlayback = () => {
        if (isPlaying) {
            pausedByUser.current = true;
            player.pause();
            return;
        }

        pausedByUser.current = false;
        player.play();
    };

    const toggleMuted = () => {
        const nextMuted = !isMuted;

        // expo-video exposes mutable playback state through the player instance.
        // eslint-disable-next-line react-hooks/immutability
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
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={isPlaying ? "Wstrzymaj film" : "Wznów film"}
                    onPress={togglePlayback}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 20,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {!isPlaying && (
                        <View pointerEvents="none" className="h-14 w-14 items-center justify-center rounded-full bg-black/50">
                            <Play
                                size={28}
                                color="#ffffff"
                                fill="#ffffff"
                            />
                        </View>
                    )}
                </Pressable>
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
                        className="absolute right-4 top-4 h-11 w-11 items-center justify-center rounded-full bg-black/50"
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
