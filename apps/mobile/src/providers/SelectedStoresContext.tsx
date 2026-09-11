import {createContext, useCallback, useContext, useMemo, useState, type ReactNode} from "react";
import {stores, type StoresT} from "@gotujto/shared/data/stableData";

type SelectedStoresContextValue = {
    selectedStores: StoresT[];
    setSelectedStores: (stores: StoresT[]) => void;
};

type SelectedStoresProviderProps = {
    children: ReactNode;
};

const SelectedStoresContext = createContext<SelectedStoresContextValue | undefined>(
    undefined,
);

export function SelectedStoresProvider({
                                           children,
                                       }: SelectedStoresProviderProps) {
    const [selectedStores, setSelectedStoresState] = useState<StoresT[]>([
        ...stores,
    ]);

    const setSelectedStores = useCallback((newStores: StoresT[]) => {
        const normalizedStores = stores.filter(store =>
            newStores.includes(store),
        );

        setSelectedStoresState(normalizedStores);
    }, []);

    const value = useMemo(
        () => ({
            selectedStores,
            setSelectedStores,
        }),
        [selectedStores, setSelectedStores],
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