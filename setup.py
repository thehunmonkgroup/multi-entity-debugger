from setuptools import find_packages, setup
from os import path

FILE_DIR = path.dirname(path.abspath(path.realpath(__file__)))

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt") as f:
    install_requirement = f.readlines()

setup(
    name="multi-entity-debugger",
    version="0.1.0",
    author="Chad Phillips",
    author_email="chad@apartmentlines.com",
    description="Simple UI for displaying/updating data from multiple entities in a web browser.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/thehunmonkgroup/multi-entity-debugger",
    packages=find_packages(),
    package_data={
        "multi_entity_debugger": [
            "index.html",
            "static/*",
            "static/**/*",
        ],
    },
    install_requires=install_requirement,
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Debuggers",
        "Topic :: Utilities",
        "Framework :: FastAPI",
    ],
    python_requires=">=3.9",
    entry_points={
        "console_scripts": [
            "multi-entity-debugger = multi_entity_debugger.debugger:main",
        ],
    },
    scripts=[],
)
