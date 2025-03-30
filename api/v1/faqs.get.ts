import { dataResponse } from "~/libs/response";

export default eventHandler(() => {
  return dataResponse({
    data: [
      {
        id: "10",
        question: "What is this about",
        answer:
          "The gentle rustle of leaves in the breeze carried whispers of ancient stories through the misty morning air. A lone bird soared overhead, its graceful silhouette casting fleeting shadows on the dewy grass below. ",
      },
    ],
    meta: {
      current_page: 1,
      per_page: 1,
      total: 1,
      total_pages: 1,
    },
  });
});
