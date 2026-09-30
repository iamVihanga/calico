import { Fragment, type ReactNode, useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import { create } from 'zustand';

type PortalState = {
  nodes: Record<string, ReactNode>;
  set: (id: string, node: ReactNode) => void;
  remove: (id: string) => void;
};

const usePortalStore = create<PortalState>((set) => ({
  nodes: {},
  set: (id, node) => set((s) => ({ nodes: { ...s.nodes, [id]: node } })),
  remove: (id) =>
    set((s) => {
      const { [id]: _removed, ...nodes } = s.nodes;
      return { nodes };
    }),
}));

/** Renders its children in `PortalHost` (full screen, above every screen) instead of in place. */
export function Portal({ children }: { children: ReactNode }) {
  const id = useId();
  useEffect(() => {
    usePortalStore.getState().set(id, children);
  }, [id, children]);
  useEffect(() => () => usePortalStore.getState().remove(id), [id]);
  return null;
}

/** Mounted once in the root layout, after the navigator. Later portals draw on top. */
export function PortalHost() {
  const nodes = usePortalStore((s) => s.nodes);
  const ids = Object.keys(nodes);
  if (!ids.length) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {ids.map((id) => (
        <Fragment key={id}>{nodes[id]}</Fragment>
      ))}
    </View>
  );
}
