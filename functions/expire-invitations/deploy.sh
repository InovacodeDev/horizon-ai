#!/bin/bash

# Deploy Script for Expire Invitations Function
# This script automates the build and deployment preparation process

set -e  # Exit on error

echo "🚀 Expire Invitations Function - Deploy Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Run this script from functions/expire-invitations/"
    exit 1
fi

print_info "Checking dependencies..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Install Node.js 20.x or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version $NODE_VERSION detected. Recommended: 20.x or higher"
fi

print_success "Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi

print_success "npm $(npm -v) detected"

# Clean previous builds
print_info "Cleaning previous builds..."
rm -rf dist/
rm -f expire-invitations.tar.gz
rm -f index.js index.d.ts index.js.map index.d.ts.map
print_success "Cleanup completed"

# Install dependencies
print_info "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Build TypeScript
print_info "Compiling TypeScript..."
npm run build
print_success "Build completed"

# Verify build was successful
if [ ! -f "index.js" ]; then
    print_error "Build failed. index.js was not created."
    exit 1
fi

# Create tar.gz file for deployment
print_info "Creating deployment archive..."
tar -czf expire-invitations.tar.gz src/ package.json tsconfig.json index.js index.d.ts
print_success "File expire-invitations.tar.gz created"

# Check file size
FILE_SIZE=$(du -h expire-invitations.tar.gz | cut -f1)
print_info "Archive size: $FILE_SIZE"

# Check if Appwrite CLI is installed
if command -v appwrite &> /dev/null; then
    print_success "Appwrite CLI detected"
    echo ""
    print_info "You can deploy using:"
    echo "  1. Appwrite Console (Manual): Upload expire-invitations.tar.gz"
    echo "  2. Appwrite CLI: appwrite deploy function"
    echo ""
    read -p "Deploy via CLI now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Starting CLI deployment..."
        appwrite deploy function
        print_success "Deployment completed!"
    else
        print_info "Deployment cancelled. Upload expire-invitations.tar.gz manually in Appwrite Console."
    fi
else
    print_warning "Appwrite CLI not detected"
    echo ""
    print_info "To deploy:"
    echo "  1. Access Appwrite Console"
    echo "  2. Go to Functions > Expire Invitations > Deployments"
    echo "  3. Upload the expire-invitations.tar.gz file"
    echo ""
    print_info "Or install Appwrite CLI:"
    echo "  npm install -g appwrite-cli"
fi

echo ""
print_success "Deployment preparation completed!"
echo ""
print_info "Next steps:"
echo "  1. Configure environment variables in Appwrite Console"
echo "  2. Configure schedule trigger: 0 0 * * *"
echo "  3. Test the function after deployment"
echo ""
print_info "See README.md for detailed instructions"
