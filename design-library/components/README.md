# Component design source boundary

This folder is the v0.1 Designer／RD component-catalog pilot. Each component family has
one `<stable-id>/component.yaml` contract. React implementations and colocated Storybook
stories stay under `platform/ui/`.

`pilot-approved` means the Product Owner has approved prototype use. It does not mean
Designer or RD has granted canonical approval. Figma references may remain `pending`
during the RD-baseline pilot, but RD source paths and hashes are always required.

Run `npm run validate:components` after changing a contract, implementation path or
referenced asset collection. The complete long-term canonical schema remains deferred
until this pilot has produced Designer／RD evidence.
