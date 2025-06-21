using ChoirApp.Domain.Services;
using ChoirApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace ChoirApp.Infrastructure.Services
{
    public class ChoirUniquenessChecker : IChoirUniquenessChecker
    {
        private readonly ApplicationDbContext _context;

        public ChoirUniquenessChecker(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> IsUnique(string choirName)
        {
            return !await _context.Choirs.AnyAsync(c => c.ChoirName == choirName);
        }
    }
}
