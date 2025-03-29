import json
import sys

def convert_glove_to_json(input_file, output_file, max_words=5000):
    """
    Convert GloVe embeddings from text format to JSON for JavaScript use.
    
    Args:
        input_file: Path to the glove.6B.50d.txt file
        output_file: Path for the output JSON file
        max_words: Maximum number of words to include (most frequent first)
    """
    embeddings = {}
    count = 0
    
    print(f"Reading GloVe embeddings from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            if count >= max_words:
                break
                
            values = line.strip().split(' ')
            word = values[0]
            vector = [float(val) for val in values[1:]]
            
            embeddings[word] = vector
            count += 1
            
            if count % 1000 == 0:
                print(f"Processed {count} words...")
    
    print(f"Writing {count} embeddings to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(embeddings, f)
    
    print("Conversion complete!")
    print(f"JSON file size: {round(os.path.getsize(output_file) / (1024 * 1024), 2)} MB")

if __name__ == "__main__":
    import os
    
    # Default paths
    default_input = "glove.6B.50d.txt"
    default_output = "embeddings-mini.json"
    default_max_words = 5000
    
    # Check command line arguments
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        input_file = default_input
    
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    else:
        output_file = default_output
    
    if len(sys.argv) > 3:
        max_words = int(sys.argv[3])
    else:
        max_words = default_max_words
    
    convert_glove_to_json(input_file, output_file, max_words)