using System.Collections.Generic;

namespace ChoirApp.Backend.Endpoints.Songs.Responses
{
    public class SearchSongsResponse
    {
        public List<SongResponse> Songs { get; set; } = new();
        public int TotalCount { get; set; }
        public int Skip { get; set; }
        public int Take { get; set; }
        public bool HasMore { get; set; }
    }
}
