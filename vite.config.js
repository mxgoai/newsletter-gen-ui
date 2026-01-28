import path from "path";
import handlebars from "vite-plugin-handlebars";

export default {
  plugins: [
    handlebars({
      partialDirectory: path.resolve(__dirname, "partials"),
    }),
  ],
};
