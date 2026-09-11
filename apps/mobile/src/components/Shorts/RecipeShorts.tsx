import {useRef, useState} from "react";
import {FlatList, useWindowDimensions, View, type ViewToken} from "react-native";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import {type ShortsFeedItem} from "@gotujto/shared/types/result-type";
import ShortItem from "@/components/Shorts/ShortItem";
import BlogShortItem from "@/components/Shorts/BlogShortItem";
import SocialShortItem from "@/components/Shorts/SocialShortItem";
import AdShortItem from "@/components/Shorts/AdShortItem";

const PREFETCH_DISTANCE = 2;

type RecipeShortsProps = {
    items: ShortsFeedItem[];
    onApproachingEnd?: () => void;
    productIds?: Id<"products">[];
};

export default function RecipeShorts({items, onApproachingEnd, productIds}: RecipeShortsProps) {
    const {width, height} = useWindowDimensions();
    const [isMuted, setIsMuted] = useState(true);
    const [activeItemIndex, setActiveItemIndex] = useState(0);
    const verticalListRef = useRef<FlatList<ShortsFeedItem>>(null);
    const itemsRef = useRef(items);
    const onApproachingEndRef = useRef(onApproachingEnd);
    const lastTriggeredBoundaryRef = useRef<string | null>(null);

    itemsRef.current = items;
    onApproachingEndRef.current = onApproachingEnd;

    const onViewableItemsChanged = useRef(
        ({viewableItems}: {viewableItems: ViewToken<ShortsFeedItem>[]}) => {
            const visibleItem = viewableItems[0];

            if (visibleItem?.index == null) {
                return;
            }

            const activeIndex = visibleItem.index;
            const currentItems = itemsRef.current;

            setActiveItemIndex(activeIndex);

            if (currentItems.length === 0) {
                return;
            }

            const remainingItems = currentItems.length - activeIndex - 1;

            if (remainingItems > PREFETCH_DISTANCE) {
                return;
            }

            const lastItem = currentItems[currentItems.length - 1];
            const boundaryKey = `${currentItems.length}:${lastItem.id}`;

            if (lastTriggeredBoundaryRef.current === boundaryKey) {
                return;
            }

            lastTriggeredBoundaryRef.current = boundaryKey;
            onApproachingEndRef.current?.();
        },
    ).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80,
    }).current;

    return (
        <FlatList<ShortsFeedItem>
            ref={verticalListRef}
            data={items}
            keyExtractor={item => item.id}
            renderItem={({item, index}) => {
                if (item.type === "social") {
                    return (
                        <SocialShortItem
                            item={item}
                            width={width}
                            height={height}
                        />
                    );
                }

                if (item.type === "blog") {
                    return (
                        <BlogShortItem
                            item={item}
                            width={width}
                            height={height}
                            isActive={activeItemIndex === index}
                            isMuted={isMuted}
                            onMutedChange={setIsMuted}
                        />
                    );
                }

                if (item.type === "ad") {
                    return (
                        <View style={{width, height}}>
                            <AdShortItem />
                        </View>
                    );
                }

                return (
                    <ShortItem
                        item={item.data}
                        width={width}
                        height={height}
                        isActive={activeItemIndex === index}
                        isMuted={isMuted}
                        onMutedChange={setIsMuted}
                        productIds={productIds}
                    />
                );
            }}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={height}
            snapToAlignment="start"
            disableIntervalMomentum
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            initialNumToRender={2}
            windowSize={3}
            getItemLayout={(_, index) => ({
                length: height,
                offset: height * index,
                index,
            })}
        />
    );
}