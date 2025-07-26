using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChoirApp.Infrastructure.Repositories
{
    public class TagRepository : ITagRepository
    {
        private readonly ApplicationDbContext _context;

        public TagRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Tag?> GetByIdAsync(Guid tagId)
        {
            return await _context.Tags.FindAsync(tagId);
        }

        public async Task<Tag?> GetByNameAsync(string tagName)
        {
            return await _context.Tags.FirstOrDefaultAsync(t => 
                t.TagName.ToLower() == tagName.ToLower());
        }

        public async Task<List<Tag>> GetAllAsync()
        {
            return await _context.Tags.ToListAsync();
        }

        public Task<Tag> AddAsync(Tag tag)
        {
            _context.Tags.Add(tag);
            return Task.FromResult(tag);
        }

        public Task UpdateAsync(Tag tag)
        {
            _context.Tags.Update(tag);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Tag tag)
        {
            _context.Tags.Remove(tag);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<SongTag?> GetSongTagAsync(Guid songId, Guid tagId)
        {
            return await _context.SongTags
                .FirstOrDefaultAsync(st => st.SongId == songId && st.TagId == tagId);
        }

        public async Task<List<SongTag>> GetSongTagsAsync(Guid songId)
        {
            return await _context.SongTags
                .Where(st => st.SongId == songId)
                .Include(st => st.Tag)
                .ToListAsync();
        }

        public async Task AddSongTagAsync(SongTag songTag)
        {
            _context.SongTags.Add(songTag);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveSongTagAsync(SongTag songTag)
        {
            _context.SongTags.Remove(songTag);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Tag>> SearchTagsAsync(string query, int maxResults = 10)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                // Return tags alphabetically when no query
                return await _context.Tags
                    .OrderBy(t => t.TagName)
                    .Take(maxResults)
                    .ToListAsync();
            }

            var normalizedQuery = query.Trim().ToLower();
            
            // Get tags with fuzzy matching:
            // 1. Exact matches (highest priority)
            // 2. Starts with query
            // 3. Contains query
            var tags = await _context.Tags
                .Where(t => t.TagName.ToLower().Contains(normalizedQuery))
                .OrderBy(t => t.TagName.ToLower() == normalizedQuery ? 0 : // Exact match first
                             t.TagName.ToLower().StartsWith(normalizedQuery) ? 1 : // Starts with second
                             2) // Contains third
                .ThenBy(t => t.TagName.Length) // Shorter names first within same priority
                .ThenBy(t => t.TagName) // Alphabetical as final tiebreaker
                .Take(maxResults)
                .ToListAsync();

            return tags;
        }
    }
}
