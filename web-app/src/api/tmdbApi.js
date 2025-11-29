const TMDB_API_KEY = "7ecef90d8e1fd42ba6acb3b206881092";



const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

if (!TMDB_API_KEY) {
    console.warn(
        '[TMDB] there is no key.'
    );
}

// create poster URL
export function getPosterUrl(posterPath) {
    if (!posterPath) {
        // case of no poster
        return 'https://placehold.co/600x900/333652/FFFFFF?text=No+Image';
    }
    return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
}

// movie information (id)
export async function fetchMovieById(id) {
    const url = `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed TMDB request : ${res.status}`);
    }
    return res.json(); // movie object
}

export async function searchMovieByTitle(title) {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        title
    )}&language=en-US`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB search API error: ${res.status}`);

    const data = await res.json();
    return data.results;   
}

// multiple id
export async function fetchMoviesByIds(ids) {
    const promises = ids.map(id => fetchMovieById(id));
    return Promise.all(promises);
}