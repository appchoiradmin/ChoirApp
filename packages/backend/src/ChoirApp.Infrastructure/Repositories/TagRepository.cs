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
            return await _context.Tags.FirstOrDefaultAsync(t => t.TagName == tagName);
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
    }
}
