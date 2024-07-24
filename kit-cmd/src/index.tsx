import { Primitive } from '@radix-ui/react-primitive'
import * as React from 'react'

type Children = { children?: React.ReactNode }
type DivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>

type CommandProps = Children & DivProps & {
  value?: string;
  onValueChange?: (value: string) => void;
}

type State = {
  search: string;
  value: string;
}

type Store = {
  subscribe: (callback: () => void) => () => void;
  snapshot: () => State;
  setState: <K extends keyof State>(key: K, value: State[K], opts?: any) => void;
  emit: () => void;
}

const StoreContext = React.createContext<Store | undefined>(undefined)
const useStore = () => React.useContext(StoreContext)

const Command = React.forwardRef<HTMLDivElement, CommandProps>((props, forwardedRef) => {
  const listeners = useLazyRef<Set<() => void>>(() => new Set());
  const state = useLazyRef<State>(() => ({
    search: '',
    value: ''
  }))

  const store: Store = React.useMemo(() => {
    return {
      subscribe: (cb) => {
        listeners.current.add(cb);
        return () => listeners.current.delete(cb);
      },
      snapshot: () => {
        return state.current;
      },
      setState: (key, value) => {
        if (Object.is(state.current[key], value)) return;
        state.current[key] = value;

        // Notify subscribers that state has changed
        store.emit();
      },
      emit: () => {
        listeners.current.forEach((l) => l());
      },
    };
  }, []);

  return (
    <Primitive.div ref={forwardedRef} tabIndex={-1}>
      <StoreContext.Provider value={store}></StoreContext.Provider>
    </Primitive.div>
  )
});

const Item = () => {
  return (
    <Primitive.div></Primitive.div>
  )
}

const Group = () => {
  return (
    <Primitive.div></Primitive.div>
  )
}

const Separator = () => {
  return (
    <Primitive.div></Primitive.div>
  )
}

const Input = () => {
  return (
    <Primitive.input></Primitive.input>
  )
}

const List = () => {
  return (
    <Primitive.div></Primitive.div>
  )
}

const Result = () => {
  return (
    <Primitive.div></Primitive.div>
  )
}

const Empty = () => {
  return (
    <Primitive.div></Primitive.div>
  )
}

export { Command as CommandRoot }
export { Result as CommandResult }
export { List as CommandList }
export { Item as CommandItem }
export { Input as CommandInput }
export { Group as CommandGroup }
export { Separator as CommandSeparator }
export { Empty as CommandEmpty }

function useLazyRef<T>(fn: () => T) {
  const ref = React.useRef<T>()

  if (ref.current === undefined) {
    ref.current = fn()
  }

  return ref as React.MutableRefObject<T>
}