import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {stores, type StoresT} from "@gotujto/shared/data/stableData";

type SelectedStoresContextValue = {
    selectedStores: StoresT[];
    setSelectedStores: (stores: StoresT[]) => void;
    isReady: boolean;
};

type SelectedStoresProviderProps = {
    children: ReactNode;
};

const SelectedStoresContext = createContext<SelectedStoresContextValue | undefined>(
    undefined,
);

const SELECTED_STORES_KEY = "gotujto:selected-stores";

export function SelectedStoresProvider({
                                           children,
                                       }: SelectedStoresProviderProps) {
    const [selectedStores, setSelectedStoresState] = useState<StoresT[]>([
        ...stores,
    ]);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        void AsyncStorage.getItem(SELECTED_STORES_KEY)
            .then(value => {
                if (!value) {
                    return;
                }

                const parsed = JSON.parse(value);

                if (Array.isArray(parsed)) {
                    setSelectedStoresState(stores.filter((store): store is StoresT => parsed.includes(store)));
                }
            })
            .catch(() => {
                setSelectedStoresState([...stores]);
            })
            .finally(() => {
                setIsReady(true);
            });
    }, []);

    const setSelectedStores = useCallback((newStores: StoresT[]) => {
        const normalizedStores = stores.filter(store =>
            newStores.includes(store),
        );

        setSelectedStoresState(normalizedStores);
        void AsyncStorage.setItem(SELECTED_STORES_KEY, JSON.stringify(normalizedStores));
    }, []);

    const value = useMemo(
        () => ({
            selectedStores,
            setSelectedStores,
            isReady,
        }),
        [isReady, selectedStores, setSelectedStores],
    );

    return (
        <SelectedStoresContext.Provider value={value}>
            {children}
        </SelectedStoresContext.Provider>
    );
}

export function useSelectedStores() {
    const context = useContext(SelectedStoresContext);

    if (context === undefined) {
        throw new Error(
            "useSelectedStores musi być użyty wewnątrz SelectedStoresProvider.",
        );
    }

    return context;
}
