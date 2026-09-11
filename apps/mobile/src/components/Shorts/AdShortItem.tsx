import {useEffect, useState} from "react";
import {ActivityIndicator, Image, View} from "react-native";
import {NativeAd, NativeAdView, NativeAsset, NativeAssetType, NativeMediaView, TestIds} from "react-native-google-mobile-ads";
import {Text} from "@/components/ui/text";

export default function AdShortItem() {
    const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let mounted = true;
        let loadedAd: NativeAd | null = null;

        NativeAd.createForAdRequest(TestIds.NATIVE)
            .then(ad => {
                loadedAd = ad;

                if (mounted) {
                    setNativeAd(ad);
                } else {
                    ad.destroy();
                }
            })
            .catch(error => {
                console.error("Native ad failed:", error);

                if (mounted) {
                    setHasError(true);
                }
            });

        return () => {
            mounted = false;
            loadedAd?.destroy();
        };
    }, []);

    if (hasError) {
        return (
            <View className="h-full w-full items-center justify-center bg-neutral-950 px-6">
                <Text className="text-center text-sm text-white/45">
                    Nie udało się załadować reklamy.
                </Text>
            </View>
        );
    }

    if (!nativeAd) {
        return (
            <View className="h-full w-full items-center justify-center bg-neutral-950">
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    return (
        <View className="h-full w-full items-center justify-center bg-neutral-950 px-5">
            <NativeAdView
                nativeAd={nativeAd}
                className="h-3/4 w-full overflow-hidden rounded-3xl border border-white/10 bg-neutral-900"
            >
                <View className="flex-row items-center gap-3 px-5 pb-4 pt-5">
                    {nativeAd.icon && (
                        <NativeAsset assetType={NativeAssetType.ICON}>
                            <Image
                                source={{uri: nativeAd.icon.url}}
                                className="h-12 w-12 rounded-xl"
                            />
                        </NativeAsset>
                    )}

                    <View className="flex-1">
                        <Text className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                            Reklama
                        </Text>

                        {nativeAd.advertiser && (
                            <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                                <Text className="mt-1 text-sm text-white/55">
                                    {nativeAd.advertiser}
                                </Text>
                            </NativeAsset>
                        )}
                    </View>
                </View>

                {nativeAd.mediaContent && (
                    <NativeMediaView
                        className="flex-1 bg-black"
                        resizeMode="cover"
                    />
                )}

                <View className="px-5 py-5">
                    <NativeAsset assetType={NativeAssetType.HEADLINE}>
                        <Text className="text-xl font-bold text-white">
                            {nativeAd.headline}
                        </Text>
                    </NativeAsset>

                    {nativeAd.body && (
                        <NativeAsset assetType={NativeAssetType.BODY}>
                            <Text
                                numberOfLines={3}
                                className="mt-2 text-sm leading-5 text-white/65"
                            >
                                {nativeAd.body}
                            </Text>
                        </NativeAsset>
                    )}

                    {nativeAd.callToAction && (
                        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                            <View className="mt-4 items-center rounded-xl bg-orange-500 px-4 py-3">
                                <Text className="font-semibold text-white">
                                    {nativeAd.callToAction}
                                </Text>
                            </View>
                        </NativeAsset>
                    )}
                </View>
            </NativeAdView>
        </View>
    );
}