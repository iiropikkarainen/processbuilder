'use client'

import React, {
  Fragment,
  type ElementType,
  type MutableRefObject,
  type PropsWithChildren,
  type ReactElement,
  type Ref,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

// Helpers
function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T) => {
    for (let ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') {
        ref(node)
      } else {
        ;(ref as MutableRefObject<T | null>).current = node
      }
    }
  }
}

function composeEventHandlers<EventType extends { defaultPrevented: boolean }>(
  ourHandler: ((event: EventType) => void) | undefined,
  theirHandler: ((event: EventType) => void) | undefined,
) {
  return (event: EventType) => {
    theirHandler?.(event)
    if (!event.defaultPrevented) {
      ourHandler?.(event)
    }
  }
}

// Menu implementation
interface MenuContextValue {
  open: boolean
  setOpen(open: boolean): void
  buttonRef: MutableRefObject<HTMLElement | null>
  menuRef: MutableRefObject<HTMLElement | null>
}

const MenuContext = React.createContext<MenuContextValue | null>(null)

function useMenuContext(component: string) {
  let context = useContext(MenuContext)
  if (!context) {
    throw new Error(`<${component}> must be used within a <Menu>.`)
  }
  return context
}

export type MenuProps = PropsWithChildren<{
  as?: ElementType
}>

export function Menu({ as: Component = Fragment, children, ...props }: MenuProps) {
  let [open, setOpen] = useState(false)
  let buttonRef = useRef<HTMLElement | null>(null)
  let menuRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    function onPointerDown(event: PointerEvent) {
      let target = event.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    function onFocusIn(event: FocusEvent) {
      let target = event.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  let context = useMemo<MenuContextValue>(
    () => ({ open, setOpen, buttonRef, menuRef }),
    [open],
  )

  return (
    <MenuContext.Provider value={context}>
      <Component {...props}>{children}</Component>
    </MenuContext.Provider>
  )
}

export type MenuButtonProps<T extends ElementType = 'button'> = {
  as?: T
} & Omit<React.ComponentPropsWithoutRef<T>, 'as'>

export const MenuButton = forwardRef(function MenuButton<T extends ElementType = 'button'>(
  { as, onClick, ...props }: MenuButtonProps<T>,
  ref: Ref<Element>,
) {
  let { open, setOpen, buttonRef } = useMenuContext('MenuButton')
  let Component = (as ?? 'button') as ElementType

  let handleClick = composeEventHandlers<React.MouseEvent<Element>>(
    (event) => {
      event.preventDefault()
      setOpen(!open)
    },
    onClick as ((event: React.MouseEvent<Element>) => void) | undefined,
  )

  return (
    <Component
      {...(props as Record<string, unknown>)}
      ref={mergeRefs(ref as Ref<Element>, buttonRef as Ref<Element>)}
      onClick={handleClick}
      aria-haspopup="menu"
      aria-expanded={open}
      data-open={open ? '' : undefined}
    />
  )
}) as <T extends ElementType = 'button'>(
  props: MenuButtonProps<T> & { ref?: Ref<Element> },
) => ReactElement | null

export type MenuItemsProps = React.HTMLAttributes<HTMLDivElement> & {
  anchor?: string
  transition?: boolean
}

export const MenuItems = forwardRef<HTMLDivElement, MenuItemsProps>(function MenuItems(
  { anchor, onKeyDown, style, hidden, ...props },
  ref,
) {
  let { open, setOpen, menuRef, buttonRef } = useMenuContext('MenuItems')

  let handleKeyDown = composeEventHandlers<React.KeyboardEvent<HTMLDivElement>>(
    (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    },
    onKeyDown,
  )

  if (!open) {
    return null
  }

  return (
    <div
      {...props}
      role="menu"
      ref={mergeRefs(ref, menuRef)}
      data-open=""
      data-anchor={anchor}
      onKeyDown={handleKeyDown}
      style={style}
      tabIndex={-1}
    />
  )
})

export type MenuItemProps<T extends ElementType = 'button'> = {
  as?: T
} & Omit<React.ComponentPropsWithoutRef<T>, 'as'>

export const MenuItem = forwardRef(function MenuItem<T extends ElementType = 'button'>(
  { as, onClick, ...props }: MenuItemProps<T>,
  ref: Ref<Element>,
) {
  let { setOpen } = useMenuContext('MenuItem')
  let Component = (as ?? 'button') as ElementType

  let handleClick = composeEventHandlers<React.MouseEvent<Element>>(
    () => {
      setOpen(false)
    },
    onClick as ((event: React.MouseEvent<Element>) => void) | undefined,
  )

  return (
    <Component
      {...(props as Record<string, unknown>)}
      ref={ref}
      role="menuitem"
      tabIndex={-1}
      onClick={handleClick}
    />
  )
}) as <T extends ElementType = 'button'>(
  props: MenuItemProps<T> & { ref?: Ref<Element> },
) => ReactElement | null

export type MenuSectionProps = React.HTMLAttributes<HTMLDivElement>

export function MenuSection(props: MenuSectionProps) {
  return <div {...props} role="group" />
}

export type MenuHeadingProps = React.HTMLAttributes<HTMLHeadingElement>

export function MenuHeading({ as: _as, ...props }: MenuHeadingProps & { as?: ElementType }) {
  let Component = (_as ?? 'h3') as ElementType
  return <Component {...(props as Record<string, unknown>)} />
}

export type MenuSeparatorProps = React.HTMLAttributes<HTMLHRElement>

export function MenuSeparator(props: MenuSeparatorProps) {
  return <hr {...props} role="separator" />
}

export type DescriptionProps<T extends ElementType = 'p'> = {
  as?: T
} & Omit<React.ComponentPropsWithoutRef<T>, 'as'>

export const Description = forwardRef(function Description<T extends ElementType = 'p'>(
  { as, ...props }: DescriptionProps<T>,
  ref: Ref<Element>,
) {
  let Component = (as ?? 'p') as ElementType
  return <Component {...(props as Record<string, unknown>)} ref={ref} />
}) as <T extends ElementType = 'p'>(
  props: DescriptionProps<T> & { ref?: Ref<Element> },
) => ReactElement | null

// Dialog implementation
interface DialogContextValue {
  onClose(): void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

export type DialogProps = PropsWithChildren<{
  open: boolean
  onClose(open: boolean): void
  className?: string
}>

export function Dialog({ open, onClose, className, children }: DialogProps) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <DialogContext.Provider value={{ onClose: () => onClose(false) }}>
      <div className={className}>{children}</div>
    </DialogContext.Provider>
  )
}

function useDialogContext() {
  return useContext(DialogContext)
}

export type DialogBackdropProps = React.HTMLAttributes<HTMLDivElement> & {
  transition?: boolean
}

export const DialogBackdrop = forwardRef<HTMLDivElement, DialogBackdropProps>(function DialogBackdrop(
  { onClick, ...props },
  ref,
) {
  let context = useDialogContext()

  let handleClick = composeEventHandlers<React.MouseEvent<HTMLDivElement>>(
    () => {
      context?.onClose()
    },
    onClick,
  )

  return <div {...props} ref={ref} onClick={handleClick} />
})

export type DialogPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  transition?: boolean
}

export const DialogPanel = forwardRef<HTMLDivElement, DialogPanelProps>(function DialogPanel(
  { onClick, ...props },
  ref,
) {
  let handleClick = composeEventHandlers<React.MouseEvent<HTMLDivElement>>(
    (event) => {
      event.stopPropagation()
    },
    onClick,
  )

  return <div {...props} ref={ref} onClick={handleClick} />
})

export type ButtonProps<T extends ElementType = 'button'> = {
  as?: T
} & Omit<React.ComponentPropsWithoutRef<T>, 'as'>

export const Button = forwardRef(function Button<T extends ElementType = 'button'>(
  { as, type, ...props }: ButtonProps<T>,
  ref: Ref<Element>,
) {
  let Component = (as ?? 'button') as ElementType
  let resolvedType = type ?? (Component === 'button' ? 'button' : undefined)
  return <Component {...(props as Record<string, unknown>)} ref={ref} type={resolvedType} />
}) as <T extends ElementType = 'button'>(
  props: ButtonProps<T> & { ref?: Ref<Element> },
) => ReactElement | null

export type CloseButtonProps<T extends ElementType = 'button'> = ButtonProps<T>

export const CloseButton = forwardRef(function CloseButton<T extends ElementType = 'button'>(
  { as, onClick, ...props }: CloseButtonProps<T>,
  ref: Ref<Element>,
) {
  let context = useDialogContext()
  let Component = (as ?? 'button') as ElementType

  let handleClick = composeEventHandlers<React.MouseEvent<Element>>(
    () => {
      context?.onClose()
    },
    onClick as ((event: React.MouseEvent<Element>) => void) | undefined,
  )

  return <Component {...(props as Record<string, unknown>)} ref={ref} onClick={handleClick} />
}) as <T extends ElementType = 'button'>(
  props: CloseButtonProps<T> & { ref?: Ref<Element> },
) => ReactElement | null

export type DataInteractiveProps = PropsWithChildren<{
  as?: ElementType
}>

export function DataInteractive({ as: Component = Fragment, children, ...props }: DataInteractiveProps) {
  return <Component {...(props as Record<string, unknown>)}>{children}</Component>
}

export type FieldsetProps = React.ComponentPropsWithoutRef<'fieldset'>
export function Fieldset(props: FieldsetProps) {
  return <fieldset {...props} />
}

export type LegendProps = React.ComponentPropsWithoutRef<'legend'>
export function Legend(props: LegendProps) {
  return <legend {...props} />
}

export type LabelProps<T extends ElementType = 'label'> = {
  as?: T
} & Omit<React.ComponentPropsWithoutRef<T>, 'as'>

export const Label = forwardRef(function Label<T extends ElementType = 'label'>(
  { as, ...props }: LabelProps<T>,
  ref: Ref<Element>,
) {
  let Component = (as ?? 'label') as ElementType
  return <Component {...(props as Record<string, unknown>)} ref={ref} />
}) as <T extends ElementType = 'label'>(
  props: LabelProps<T> & { ref?: Ref<Element> },
) => ReactElement | null

export type SwitchProps = React.ComponentPropsWithoutRef<'button'> & {
  checked?: boolean
  onChange?(value: boolean): void
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked = false, onChange, onClick, ...props },
  ref,
) {
  let handleClick = composeEventHandlers<React.MouseEvent<HTMLButtonElement>>(
    () => {
      onChange?.(!checked)
    },
    onClick,
  )

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      {...props}
      ref={ref}
      onClick={handleClick}
    />
  )
})

export type CheckboxProps = React.ComponentPropsWithoutRef<'input'>
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { type, ...props },
  ref,
) {
  return <input {...props} ref={ref} type="checkbox" />
})

export type RadioProps = React.ComponentPropsWithoutRef<'input'>
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio({ type, ...props }, ref) {
  return <input {...props} ref={ref} type="radio" />
})

export type TextFieldProps = React.ComponentPropsWithoutRef<'input'>
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  props,
  ref,
) {
  return <input {...props} ref={ref} />
})

export type TextareaProps = React.ComponentPropsWithoutRef<'textarea'>
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  props,
  ref,
) {
  return <textarea {...props} ref={ref} />
})

export type ComboboxProps<T extends ElementType = 'input'> = {
  as?: T
} & Omit<React.ComponentPropsWithoutRef<T>, 'as'>
export const Combobox = forwardRef(function Combobox<T extends ElementType = 'input'>(
  { as, ...props }: ComboboxProps<T>,
  ref: Ref<Element>,
) {
  let Component = (as ?? 'input') as ElementType
  return <Component {...(props as Record<string, unknown>)} ref={ref} />
}) as <T extends ElementType = 'input'>(
  props: ComboboxProps<T> & { ref?: Ref<Element> },
) => ReactElement | null

export type ListboxProps<T extends ElementType = 'ul'> = {
  as?: T
} & Omit<React.ComponentPropsWithoutRef<T>, 'as'>
export const Listbox = forwardRef(function Listbox<T extends ElementType = 'ul'>(
  { as, ...props }: ListboxProps<T>,
  ref: Ref<Element>,
) {
  let Component = (as ?? 'ul') as ElementType
  return <Component {...(props as Record<string, unknown>)} ref={ref} />
}) as <T extends ElementType = 'ul'>(
  props: ListboxProps<T> & { ref?: Ref<Element> },
) => ReactElement | null

export type TransitionProps = PropsWithChildren<{
  show?: boolean
}>
export function Transition({ show = true, children }: TransitionProps) {
  if (!show) {
    return null
  }
  return <>{children}</>
}
