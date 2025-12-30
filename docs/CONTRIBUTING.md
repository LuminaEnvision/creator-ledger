# Contributing to Creator Ledger

Thank you for your interest in contributing to Creator Ledger! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's coding standards

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## Development Setup

See the main [README](../README.md) for setup instructions.

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow existing type patterns
- Avoid `any` types when possible
- Use interfaces for object shapes

### React

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for props
- Follow React best practices

### Styling

- Use Tailwind CSS utility classes
- Follow existing design patterns
- Keep styles consistent
- Use responsive design

### Code Style

- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused
- Follow existing code structure

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add portfolio collections feature
fix: Resolve NFT display issue on mobile
docs: Update architecture documentation
refactor: Simplify premium status check
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Pull Request Process

1. **Update Documentation**: Update README or docs if needed
2. **Add Tests**: Add tests for new features
3. **Test Locally**: Ensure everything works
4. **Update CHANGELOG**: Add entry to changelog (if applicable)
5. **Create PR**: Open pull request with clear description

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
```

## Testing

### Before Submitting

- Test on multiple browsers
- Test on mobile devices
- Test wallet connections
- Test smart contract interactions
- Verify no console errors

### Test Checklist

- [ ] Wallet connection works
- [ ] Content submission works
- [ ] NFT display works
- [ ] Premium features work (if applicable)
- [ ] Admin functions work (if applicable)
- [ ] Export functions work
- [ ] No TypeScript errors
- [ ] No linting errors

## Smart Contract Changes

If contributing smart contract changes:

1. **Test Locally**: Use Hardhat local network
2. **Test on Testnet**: Deploy to Base Sepolia
3. **Gas Optimization**: Optimize gas usage
4. **Security Review**: Consider security implications
5. **Documentation**: Update contract docs

## Documentation

When updating documentation:

- Keep it clear and concise
- Use code examples
- Update all relevant sections
- Check for broken links
- Use proper markdown formatting

## Questions?

- Open an issue for questions
- Check existing issues first
- Be patient with responses

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Creator Ledger! 🎉

