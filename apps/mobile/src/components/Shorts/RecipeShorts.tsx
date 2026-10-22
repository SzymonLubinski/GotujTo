import {useEffect, useRef, useState} from "react";
import {FlatList, useWindowDimensions, type ViewToken} from "react-native";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import {type ShortsFeedItem} from "@gotujto/shared/types/result-type";
import ShortItem from "@/components/Shorts/ShortItem";
import BlogShortItem from "@/components/Shorts/BlogShortItem";
import SocialShortItem from "@/components/Shorts/SocialShortItem";

const PREFETCH_DISTANCE = 2;
const viewabilityConfig = {itemVisiblePercentThreshold: 80};

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
    const lastTriggeredBoundaryRef = useRef<string | null>(null);
    const itemsRef = useRef(items);
    const onApproachingEndRef = useRef(onApproachingEnd);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => {
        onApproachingEndRef.current = onApproachingEnd;
    }, [onApproachingEnd]);

    // FlatList requires this callback's identity to remain unchanged after mount.
    const [onViewableItemsChanged] = useState(() =>
        ({viewableItems}: {viewableItems: ViewToken<ShortsFeedItem>[]}) => {
            const visibleItem = viewableItems[0];

            if (visibleItem?.index == null) {
                return;
            }

            const activeIndex = visibleItem.index;
            setActiveItemIndex(activeIndex);

            const currentItems = itemsRef.current;

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
    );

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
