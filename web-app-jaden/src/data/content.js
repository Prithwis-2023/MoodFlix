// Shared data: movies and series
const getImagePath = (img) => {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}images/${img}`;
};

export const movies = [
  { 
    id: 1,
    title: "Dude", 
    rating: 7.2, 
    poster: getImagePath("image1.png"), 
    description: "A coming-of-age adventure.",
    runtime: 120,
    release_date: "2023-05-15",
    overview: "A coming-of-age adventure that follows a group of friends navigating life's challenges.",
    genres: [{ id: 1, name: "Drama" }, { id: 2, name: "Adventure" }],
    vote_average: 7.2
  },
  { 
    id: 2,
    title: "The Shadow's Edge", 
    rating: 7.7, 
    poster: getImagePath("image2.png"), 
    description: "Crime thriller about secrets.",
    runtime: 135,
    release_date: "2023-08-20",
    overview: "A gripping crime thriller that delves into dark secrets and moral ambiguity.",
    genres: [{ id: 3, name: "Crime" }, { id: 4, name: "Thriller" }],
    vote_average: 7.7
  },
  { 
    id: 3,
    title: "Jolly LLB 3", 
    rating: 7.1, 
    poster: getImagePath("image3.png"), 
    description: "Courtroom drama with heart.",
    runtime: 145,
    release_date: "2024-01-10",
    overview: "A heartwarming courtroom drama that explores justice and morality with humor.",
    genres: [{ id: 5, name: "Drama" }, { id: 6, name: "Comedy" }],
    vote_average: 7.1
  },
  { 
    id: 4,
    title: "The Woman in the Line", 
    rating: 7.6, 
    poster: getImagePath("image4.png"), 
    description: "Psychological noir.",
    runtime: 128,
    release_date: "2023-11-05",
    overview: "A psychological noir thriller that keeps you guessing until the very end.",
    genres: [{ id: 7, name: "Mystery" }, { id: 8, name: "Thriller" }],
    vote_average: 7.6
  }
];

export const series = [
  { 
    id: 5,
    title: "City Stories", 
    rating: 8.0, 
    poster: getImagePath("image5.png"), 
    description: "Interwoven lives across one city.",
    runtime: 45,
    release_date: "2023-09-12",
    overview: "Interwoven stories of diverse characters living in the same bustling city.",
    genres: [{ id: 1, name: "Drama" }],
    vote_average: 8.0
  },
  { 
    id: 6,
    title: "Night Skies", 
    rating: 8.2, 
    poster: getImagePath("image6.png"), 
    description: "Sci-fi suspense under the stars.",
    runtime: 50,
    release_date: "2024-02-28",
    overview: "A sci-fi suspense series exploring mysteries from outer space.",
    genres: [{ id: 9, name: "Sci-Fi" }, { id: 10, name: "Mystery" }],
    vote_average: 8.2
  },
  { 
    id: 7,
    title: "Microcosm", 
    rating: 7.6, 
    poster: getImagePath("image7.png"), 
    description: "Small mysteries with big consequences.",
    runtime: 42,
    release_date: "2023-07-18",
    overview: "Small-town mysteries that reveal larger truths about human nature.",
    genres: [{ id: 8, name: "Thriller" }, { id: 10, name: "Mystery" }],
    vote_average: 7.6
  }
];

export const allContent = [...movies, ...series];
