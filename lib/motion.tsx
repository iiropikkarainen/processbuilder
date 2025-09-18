'use client'

import React, { forwardRef, type ElementType, type PropsWithChildren, type Ref } from 'react'

export function LayoutGroup({ children }: PropsWithChildren<{ id?: string }>) {
  return <>{children}</>
}

type MotionComponentProps<T extends ElementType> = {
  as?: T
} & Omit<React.ComponentPropsWithoutRef<T>, 'as'>

type MotionComponent = <T extends ElementType = 'span'>(
  props: MotionComponentProps<T> & { ref?: Ref<Element> },
) => React.ReactElement | null

function createMotionComponent<Tag extends ElementType>(tag: Tag): MotionComponent {
  return forwardRef(function MotionComponentInternal<T extends ElementType = Tag>(
    { as, ...props }: MotionComponentProps<T>,
    ref: Ref<Element>,
  ) {
    let Component = (as ?? tag) as ElementType
    return <Component {...(props as Record<string, unknown>)} ref={ref} />
  }) as MotionComponent
}

export const motion: { span: MotionComponent } = {
  span: createMotionComponent('span'),
}
