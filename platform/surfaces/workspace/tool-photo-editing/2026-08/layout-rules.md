# Photo Editing Tool layout rules

Use navigation, tool navigation, inspector and image canvas as the starting shell. The
canvas is the main work result; controls must not displace it without an explicit PM
decision. Empty, processing, result and recovery states remain feature-specific.

## Decision basis

Keeping the canvas as the dominant region preserves the familiar editing mental model
while allowing new tools to alter inspector content.

