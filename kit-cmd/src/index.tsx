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

const Command = React.forwardRef<HTMLDivElement, CommandProps>(() => {
  return (
    <Primitive.div></Primitive.div>
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