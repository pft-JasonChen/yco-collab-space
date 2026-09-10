import { publicSurfaceIndex } from "./surface-bindings.mjs";

export default function surfaceIndexPlugin() {
  const id = "virtual:surface-index";
  return {
    name: "surface-index",
    resolveId(source) {
      if (source === id) return "\0" + id;
    },
    async load(source) {
      if (source !== "\0" + id) return;
      const index = await publicSurfaceIndex();
      return "export default " + JSON.stringify(index) + ";";
    },
    handleHotUpdate({ file, server }) {
      if (
        !/[/\\](platform[/\\]surfaces|design-library[/\\]components|features)[/\\]/.test(
          file,
        )
      )
        return;
      const module = server.moduleGraph.getModuleById("\0" + id);
      if (module) server.moduleGraph.invalidateModule(module);
      server.ws.send({ type: "full-reload" });
    },
  };
}
