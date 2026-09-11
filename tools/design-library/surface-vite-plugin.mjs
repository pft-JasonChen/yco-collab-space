import { publicSurfaceIndex } from "./surface-bindings.mjs";
import { readJson } from "../prototype-cli/project.mjs";
import { publicIntake } from "../migration/intake-inventory.mjs";

export default function surfaceIndexPlugin() {
  const id = "virtual:surface-index";
  return {
    name: "surface-index",
    resolveId(source) {
      if (source === "virtual:rd-intake") return "\0" + source;
      if (source === id) return "\0" + id;
    },
    async load(source) {
      if (source === "\0virtual:rd-intake")
        return (
          "export default " +
          JSON.stringify(
            publicIntake(
              await readJson("migration/rd-intake-inventory.json"),
              await readJson("migration/ai-video-pilot.json"),
            ),
          ) +
          ";"
        );
      if (source !== "\0" + id) return;
      const index = await publicSurfaceIndex();
      return "export default " + JSON.stringify(index) + ";";
    },
    handleHotUpdate({ file, server }) {
      if (
        /[/\\]migration[/\\](rd-intake-inventory|ai-video-pilot)\.json$/.test(
          file,
        )
      ) {
        const intakeModule = server.moduleGraph.getModuleById(
          "\0virtual:rd-intake",
        );
        if (intakeModule) server.moduleGraph.invalidateModule(intakeModule);
        server.ws.send({ type: "full-reload" });
        return;
      }
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
