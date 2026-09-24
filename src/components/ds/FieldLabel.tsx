import { Txt } from './Txt';

/** Uppercase field label (Input, Select): 12 / 700 / caps tracking / muted. */
export function FieldLabel({ children }: { children: string }) {
  return (
    <Txt role="label" color="textMuted">
      {children}
    </Txt>
  );
}
